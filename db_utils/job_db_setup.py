from sqlalchemy import create_engine
from db_utils.models import Base
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///jobs.db')  # This creates jobs.db file
print("remote jobs db created")
Base.metadata.create_all(engine)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
