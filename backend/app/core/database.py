import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import urlparse
from app.core.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def create_database_if_not_exists(database_url: str):
    """Attempts to create the target MySQL database if it does not exist."""
    try:
        parsed = urlparse(database_url)
        if "mysql" in parsed.scheme:
            # Connect to server without database name to run CREATE DATABASE
            db_name = parsed.path.lstrip("/")
            server_url = f"{parsed.scheme}://{parsed.netloc}/"
            temp_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            temp_engine.dispose()
            logger.info(f"Verified/Created MySQL database '{db_name}'.")
    except Exception as e:
        logger.warning(f"Could not automatically create MySQL database: {e}")

def get_engine():
    """Initializes the database engine, falling back to SQLite if MySQL fails."""
    primary_url = settings.DATABASE_URL
    if "mysql" in primary_url:
        try:
            create_database_if_not_exists(primary_url)
            engine = create_engine(
                primary_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=10,
                max_overflow=20
            )
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"Connected to MySQL database at {primary_url.split('@')[-1]}")
            return engine
        except Exception as e:
            logger.warning(f"MySQL connection failed: {e}")
            if settings.FALLBACK_TO_SQLITE:
                logger.info(f"Falling back to SQLite at {settings.SQLITE_URL} for local development/demo.")
                return create_engine(
                    settings.SQLITE_URL,
                    connect_args={"check_same_thread": False}
                )
            else:
                raise e
    else:
        # SQLite or other DB
        connect_args = {"check_same_thread": False} if "sqlite" in primary_url else {}
        return create_engine(primary_url, connect_args=connect_args)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
