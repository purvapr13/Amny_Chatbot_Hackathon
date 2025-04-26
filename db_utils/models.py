from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class Job(Base):
    __tablename__ = 'jobs'

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    category = Column(String, nullable=True)
    tags = Column(String, nullable=True)  # Stored as comma-separated string of tags
    url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    published_at = Column(String, nullable=True)  # ISO string for now
    source = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)

    def set_tags(self, tags_list):
        """Converts list to comma-separated string for storage."""
        self.tags = ', '.join(tags_list)

    def get_tags(self):
        """Converts comma-separated string back to list."""
        return self.tags.split(', ') if self.tags else []

    def __repr__(self):
        return f"<Job {self.id} - {self.title}>"
