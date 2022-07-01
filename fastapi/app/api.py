from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
    "localhost:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.post("/getinformation")
async def getinformation(info: Request):
    req_info = await info.json()
    return {
        "status": "SUCCESS",
        "data": req_info
    }

@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome."}


keys = [
    {
        "id": "1",
        "item": "Registration Key 1"
    },
    {
        "id": "2",
        "item": "Registration Key 2"
    }
]

@app.get("/todo", tags=["keys"])
async def get_todos() -> dict:
    return { "data": keys }