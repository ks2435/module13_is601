from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user
from database import Base, engine, get_db
from hashing import hash_password, verify_password
from models import User
from schemas import Token, UserLogin, UserRead, UserRegister

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Module 13 - JWT Auth + Front-End",
    description="FastAPI with JWT-based registration/login and HTML pages.",
    version="1.0.0",
)


@app.get("/", include_in_schema=False)
def index():
    return RedirectResponse(url="/static/register.html")


@app.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, tags=["auth"])
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = (
        db.query(User)
        .filter((User.username == payload.username) | (User.email == payload.email))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})
    return Token(access_token=token)


@app.post("/login", response_model=Token, tags=["auth"])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return Token(access_token=token)


@app.get("/me", response_model=UserRead, tags=["auth"])
def me(current_user: User = Depends(get_current_user)):
    return current_user


# Mount static files last so routes above take precedence.
app.mount("/static", StaticFiles(directory="static"), name="static")