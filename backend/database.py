from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import DB_PATH

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, nullable=False)
    description   = Column(Text, nullable=True)
    content       = Column(Text, nullable=True)
    url           = Column(String, unique=True, nullable=False)
    source        = Column(String, nullable=True)
    published_at  = Column(DateTime, nullable=True)
    fetched_at    = Column(DateTime, default=datetime.utcnow)
    sentiment     = Column(Float, nullable=True)
    tickers       = Column(String, nullable=True)
    summary       = Column(Text, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()