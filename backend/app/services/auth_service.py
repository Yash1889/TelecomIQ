import os
import hashlib
from datetime import datetime, timedelta, timezone
import jwt
try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False

SECRET_KEY = os.getenv("JWT_SECRET", "telecomiq-ultra-secure-jwt-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

def _truncate_password(password: str) -> bytes:
    """Safely encode password to bytes and cap at 72 bytes for standard bcrypt limit."""
    return password.encode("utf-8")[:72]

def hash_password(password: str) -> str:
    """Hash a plaintext password using direct bcrypt or pbkdf2 fallback."""
    if HAS_BCRYPT:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(_truncate_password(password), salt)
        return hashed.decode("utf-8")
    else:
        # Standard library secure fallback
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return f"pbkdf2${salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored hash."""
    if not hashed_password:
        return False
    try:
        if hashed_password.startswith("pbkdf2$"):
            parts = hashed_password.split("$")
            salt = bytes.fromhex(parts[1])
            expected_key = parts[2]
            key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
            return key.hex() == expected_key
        elif HAS_BCRYPT:
            return bcrypt.checkpw(
                _truncate_password(plain_password),
                hashed_password.encode("utf-8")
            )
    except Exception:
        pass
    return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Generate a signed JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
