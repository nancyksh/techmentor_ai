from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class DigitalTwin(Base):
    __tablename__ = "digital_twins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Stores JSON mapping of subject -> mastery %
    subject_mastery = Column(JSON, default={})
    
    # Stores JSON mapping of topic -> mastery %
    topic_mastery = Column(JSON, default={})
    
    # Stores JSON mapping of topic -> weaknesses/misconceptions
    weakness_map = Column(JSON, default={})
    
    placement_readiness_score = Column(Float, default=0.0)
    interview_readiness_score = Column(Float, default=0.0)
    
    # Relationship to user
    user = relationship("User", backref="digital_twin")
