import sys
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("admin123")
with open(r"c:\Users\Seif Waleed\OneDrive\Desktop\ML PROJECTS\barber\backend\hash.txt", "w") as f:
    f.write(hashed)
