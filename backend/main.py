from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date
import os

from backend.database import SessionLocal, engine, Application as DBApplication

app = FastAPI(title="Internship Tracker API")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ApplicationBase(BaseModel):
    company: str
    role: str
    status: str
    date_applied: date
    notes: str = ""

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    id: int

    class Config:
        from_attributes = True

@app.post("/api/applications", response_model=ApplicationResponse)
def create_application(app_data: ApplicationCreate, db: Session = Depends(get_db)):
    db_app = DBApplication(**app_data.model_dump())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@app.get("/api/applications", response_model=List[ApplicationResponse])
def read_applications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    applications = db.query(DBApplication).offset(skip).limit(limit).all()
    return applications

@app.put("/api/applications/{app_id}", response_model=ApplicationResponse)
def update_application(app_id: int, app_data: ApplicationCreate, db: Session = Depends(get_db)):
    db_app = db.query(DBApplication).filter(DBApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    for key, value in app_data.model_dump().items():
        setattr(db_app, key, value)
    
    db.commit()
    db.refresh(db_app)
    return db_app

@app.delete("/api/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    db_app = db.query(DBApplication).filter(DBApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(db_app)
    db.commit()
    return {"message": "Application deleted successfully"}

# Serve static frontend files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def read_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
