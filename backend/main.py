from fastapi import FastAPI

from controller import router

app = FastAPI(title="Document Checklist")
app.include_router(router)
