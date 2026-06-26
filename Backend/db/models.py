from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean,
    DateTime, ForeignKey, JSON, Enum
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()


def gen_uuid():
    return str(uuid.uuid4())


class EngagementStrategy(str, enum.Enum):
    REALITY_COMPRESSION = "reality_compression"
    HIDDEN_LAYER = "hidden_layer"
    PATTERN_RECOGNITION = "pattern_recognition"
    SECOND_ORDER = "second_order"
    BOTTLENECK_REVERSAL = "bottleneck_reversal"
    CONSTRUCTIVE_CONTRARIAN = "constructive_contrarian"
    AGREEMENT_EXTENSION = "agreement_extension"


class InputSource(str, enum.Enum):
    URL = "url"
    SCREENSHOT = "screenshot"
    TEXT = "text"
    PDF = "pdf"


# ── Users ──────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    clerk_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    linkedin_profile_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    voice_profile = relationship("VoiceProfile", back_populates="user", uselist=False)
    posts = relationship("Post", back_populates="user")
    comments = relationship("GeneratedComment", back_populates="user")


# ── Voice Profile ───────────────────────────────────────────
class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    tone = Column(String)                      # e.g., "Founder", "Analytical"
    style = Column(String)                     # e.g., "Observational"
    avg_sentence_length = Column(Integer)
    common_words = Column(JSON, default=list)  # ["interesting", "pattern"]
    sample_writing = Column(Text)              # raw writing samples
    raw_profile_json = Column(JSON)            # full extracted profile
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="voice_profile")


# ── Posts ───────────────────────────────────────────────────
class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    source = Column(Enum(InputSource))
    source_url = Column(String)
    raw_content = Column(Text)
    author_name = Column(String)
    author_profile = Column(String)
    likes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    post_timestamp = Column(String)

    # Analysis results
    topic = Column(String)
    industry = Column(String)
    main_claim = Column(Text)
    hidden_claim = Column(Text)
    intent = Column(String)
    audience = Column(String)
    sentiment = Column(String)
    emotional_driver = Column(String)
    contrarian_angle = Column(Text)
    controversial_score = Column(Float, default=0.0)
    full_analysis = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="posts")
    generated_comments = relationship("GeneratedComment", back_populates="post")


# ── Generated Comments ──────────────────────────────────────
class GeneratedComment(Base):
    __tablename__ = "generated_comments"

    id = Column(String, primary_key=True, default=gen_uuid)
    post_id = Column(String, ForeignKey("posts.id"))
    user_id = Column(String, ForeignKey("users.id"))

    strategy = Column(Enum(EngagementStrategy))
    raw_comment = Column(Text)        # before voice rewrite
    final_comment = Column(Text)      # after voice rewrite
    is_voice_rewritten = Column(Boolean, default=False)

    # Quality scores
    score_adds_information = Column(Float, default=0)
    score_originality = Column(Float, default=0)
    score_depth = Column(Float, default=0)
    score_founder_voice = Column(Float, default=0)
    score_screenshot_worthy = Column(Float, default=0)
    total_quality_score = Column(Float, default=0)
    passed_quality_filter = Column(Boolean, default=False)
    ranking_position = Column(Integer)

    # Performance tracking (V2)
    likes_received = Column(Integer)
    replies_received = Column(Integer)
    author_responded = Column(Boolean, default=False)
    profile_visits_generated = Column(Integer)
    was_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="generated_comments")
    user = relationship("User", back_populates="comments")