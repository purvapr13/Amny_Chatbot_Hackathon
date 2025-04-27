from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager

# Local imports
from app.router import chatbot, jobs
from app.sess_db import DatabaseManager
from app.model_loader import ModelLoader


ml_models = {}


templates = Jinja2Templates(directory="templates")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_manager = DatabaseManager(app)
    await db_manager.initialize()
    model_loader = ModelLoader()
    model_loader.load_models()

    app.state.ml_models = model_loader.get_models()

    # 👇 Insert jobs at startup (imported from separate module)
    from db_utils.populate_remotejobs import insert_remote_jobs
    insert_remote_jobs()

    yield  # Application runs here

    # Cleanup
    await db_manager.close()
    model_loader.ml_models.clear()


app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(jobs.router)
app.include_router(chatbot.router)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=5000)
