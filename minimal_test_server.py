from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    logger.info("Starting Minimal Test Server...")
    
    # Initialize database
    try:
        from database import init_database
        init_database()
        logger.info("✓ Database initialized successfully!")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise e

# Basic health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Minimal Test Server is running"}

# Test user authentication
class UserLogin(BaseModel):
    user_id: str
    password: str

@app.post("/api/login")
async def login(user_data: UserLogin):
    """Test login endpoint"""
    try:
        from database import authenticate_user
        user = authenticate_user(user_data.user_id, user_data.password)
        if user:
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "user_id": user['user_id'],
                    "full_name": user['full_name'],
                    "role": user['role']
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)