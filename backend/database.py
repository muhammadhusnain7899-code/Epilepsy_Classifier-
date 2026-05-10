import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Override with DATABASE_URL if needed. Default matches docker-compose.yml.
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:tower1234@localhost:5432/epilepsy_classifier_db",
)

_engine_kwargs: dict = {"pool_pre_ping": True}
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Fail fast instead of hanging the login button when Postgres is down.
    _engine_kwargs["connect_args"] = {"connect_timeout": 10}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
