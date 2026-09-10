from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db, get_ist_time
from app.db.models import User
from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse, UserResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user account with secure password hashing"""
    normalized_email = data.email.strip().lower()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
    
    # Public registration from the portal is strictly for Customer / Subscriber accounts
    role = "Customer"
    is_agent = False
    
    # Create new user
    new_user = User(
        email=normalized_email,
        full_name=data.full_name.strip(),
        phone=data.phone,
        organization=data.organization or "TelecomIQ",
        hashed_password=hash_password(data.password),
        role=role,
        is_agent=is_agent,
        is_active=True,
        created_at=get_ist_time()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT token
    token = create_access_token({
        "sub": new_user.email,
        "user_id": new_user.id,
        "role": new_user.role,
        "is_agent": new_user.is_agent
    })
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
        message="Registration successful! Welcome to TelecomIQ."
    )

@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate existing user with email and password"""
    normalized_email = data.email.strip().lower()
    
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password. Please check your credentials.")
    
    # If password is set, verify hash
    if user.hashed_password:
        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
    else:
        # If user existed without password (e.g. legacy seed), set their password on first login
        user.hashed_password = hash_password(data.password)
        db.commit()
        db.refresh(user)
    
    # Generate JWT token
    token = create_access_token({
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
        "is_agent": user.is_agent
    })
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        message="Login successful!"
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    authorization: Optional[str] = Header(None),
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve profile information of the currently authenticated user"""
    user_email = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload:
            user_email = payload.get("sub")
            
    if not user_email and email:
        user_email = email.strip().lower()
        
    if not user_email:
        raise HTTPException(status_code=401, detail="Authentication credentials required.")
        
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    return UserResponse.model_validate(user)
