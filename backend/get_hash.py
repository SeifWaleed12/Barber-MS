import os
import sys

# Set up python path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import hash_password

hashed = hash_password("admin123")
with open("hash.txt", "w") as f:
    f.write(hashed)
