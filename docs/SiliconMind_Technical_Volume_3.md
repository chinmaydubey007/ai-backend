# 📜 SiliconMind Legacy Manual: Volume 3 — The Great Error Bible (A–Z)

This volume is a "Post-Mortem" of every major bug we faced during development. Understanding these will help you troubleshoot SiliconMind if it ever stops working after a Windows update or code change.

---

## **[A] API Mounting Errors (The "Missing Router" 404)**
- **Symptom**: You go to `/explore` or `/lab`, but no data appears. The browser console shows `404 Not Found` for `api/v1/knowledge/graph`.
- **Root Cause**: Next.js (the face) was calling a URL that FastAPI (the brain) didn't recognize yet.
- **Fix**: I had to go into `ai_backend/src/main.py` and add `app.include_router(knowledge_router)`. This "plugs in" the new logic to the main server.

---

## **[C] CORS Block (Cross-Origin Security)**
- **Symptom**: "Could not connect to backend." The browser console says "Blocked by CORS policy."
- **Root Cause**: The backend (Port 8000) was refusing to talk to the frontend (Port 3000) because it didn't recognize it. This is a security feature to prevent hacking.
- **Fix**: I added `CORSMiddleware` in `main.py` and explicitly allowed `http://localhost:3000` and `http://127.0.0.1:3000`.

---

## **[F] Force Graph Canvas (The 0-Height Collapse)**
- **Symptom**: The "Knowledge Explorer" was a pitch-black screen.
- **Root Cause**: The graph engine needs to know the exact height of the screen in pixels. If it's inside a "Flexbox" that hasn't grown yet, it reports `0px` height and doesn't render.
- **Fix**: I added `flex: 1` and `height: 100%` to the parent container in `KnowledgeGraph.js` and used a React "Effect" (on mount) to force the canvas to measure the window size.

---

## **[G] Git Repository Conflict (The "Nested .git" Problem)**
- **Symptom**: You couldn't push the code to your GitHub because it only uploaded the folders, but no files.
- **Root Cause**: Both `ai_backend/` and `siliconmind/` had their own hidden `.git` folders. Git doesn't like "repos inside repos".
- **Fix**: I deleted the inner `.git` folders and re-initialized Git at the root (`e:\softwlearn`). Now it is a unified **"Monorepo"**.

---

## **[H] Hydration Mismatch (The Next.js Startup Crash)**
- **Symptom**: A red error screen in the browser saying "Hydration failed".
- **Root Cause**: The server tried to render the page, but the client (your browser) saw something different. This happened because we tried to access `window.location` before the page was fully loaded.
- **Fix**: I switched to using the `usePathname()` hook from Next.js, which is the official way to handle URLs without crashing the browser.

---

## **[L] Layout Stability (The "Black Screen" fix)**
- **Symptom**: The menu worked, but the main area was black and you couldn't see the chat.
- **Root Cause**: A CSS class mismatch. The code was looking for `.layout`, but the global stylesheet named it `.app-layout`.
- **Fix**: Standardized all pages to use the `.app-layout` class and ensured `background: var(--bg-primary)` was set so it looked industrial and sleek.

---

## **[S] State Race Condition (The "Chat Wiping" Bug)**
- **Symptom**: You send a message, it starts typing, and suddenly it all disappears.
- **Root Cause**: When a message starts streaming, the backend creates a "Session ID". If the frontend sees this new ID, it triggers an "Automatic Reload" of the history. But the history was still being written, so it loaded a blank history.
- **Fix**: I created an `isSendingRef`. Now, the app says: "If I am currently sending a message, STOP the automatic reload." This made the streaming stable.

---

## **[Z] Zero-Dimension Canvas (Hit Detection)**
- **Symptom**: You could see the Knowledge Graph, but clicking a node did nothing.
- **Root Cause**: The custom "Canvas Rendering" was overriding the hit-area logic. The graph didn't know where the "node" ended and the "background" began.
- **Fix**: I added explicit `ctx.beginPath()` and `ctx.arc()` calls in the drawing logic. This tells the physics engine exactly where the "clickable" circle is located.

---

**Next Volume**: The "Operations Manual". We will learn the exact commands to run the project.
