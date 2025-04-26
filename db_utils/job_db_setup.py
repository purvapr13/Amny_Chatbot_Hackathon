import os
from sqlalchemy import create_engine
from db_utils.models import Base
from sqlalchemy.orm import sessionmaker


if not os.path.exists('session_db'):
    os.makedirs('session_db')

engine = create_engine('sqlite:///session_db///jobs.db')  # This creates jobs.db file
print("remote jobs db created")
Base.metadata.create_all(engine)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
