import os
import logging
import chromadb

logger = logging.getLogger("AI_Backend.VectorStore")

class VectorStore:
    """
    Manages the ChromaDB vector database for storing and retrieving document chunks.
    ChromaDB runs entirely locally — no external service needed.
    It handles embedding generation internally using its default model.
    """

    def __init__(self, persist_dir: str = "vector_db"):
        os.makedirs(persist_dir, exist_ok=True)
        # ChromaDB will persist data to disk automatically
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
        logger.info(f"Vector store initialized. Collection has {self.collection.count()} chunks.")

    def add_chunks(self, chunks: list[dict]):
        """
        Adds document chunks to the vector database.
        ChromaDB will automatically generate embeddings using its built-in model.
        """
        if not chunks:
            return

        ids = [chunk["id"] for chunk in chunks]
        documents = [chunk["text"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]

        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )
        logger.info(f"Added {len(chunks)} chunks to vector store. Total: {self.collection.count()}")

    def search(self, query: str, n_results: int = 5) -> list[dict]:
        """
        Searches for the most relevant chunks matching the query.
        Returns a list of {text, metadata, distance} dicts.
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=min(n_results, self.collection.count()) if self.collection.count() > 0 else 1,
        )

        matches = []
        if results and results["documents"] and results["documents"][0]:
            for i in range(len(results["documents"][0])):
                matches.append({
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                })
        
        logger.info(f"Search for '{query[:50]}...' returned {len(matches)} results")
        return matches

    def get_document_list(self) -> list[dict]:
        """Returns a list of unique documents stored in the vector database."""
        if self.collection.count() == 0:
            return []
        
        all_metadata = self.collection.get()["metadatas"]
        seen = {}
        for meta in all_metadata:
            source = meta.get("source", "unknown")
            if source not in seen:
                seen[source] = {"name": source, "chunks": 0}
            seen[source]["chunks"] += 1
        
        return list(seen.values())

    def delete_document(self, source_name: str):
        """Deletes all chunks belonging to a specific document."""
        all_data = self.collection.get()
        ids_to_delete = []
        for i, meta in enumerate(all_data["metadatas"]):
            if meta.get("source") == source_name:
                ids_to_delete.append(all_data["ids"][i])
        
        if ids_to_delete:
            self.collection.delete(ids=ids_to_delete)
            logger.info(f"Deleted {len(ids_to_delete)} chunks for document '{source_name}'")
