"""
Script to deploy backend to Hugging Face Spaces
"""
import os
from huggingface_hub import HfApi, create_repo, upload_folder

# Configuration
SPACE_NAME = "epilepsy-classifier-api"
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "backend")

def deploy():
    api = HfApi()
    
    # Check if logged in
    try:
        user_info = api.whoami()
        username = user_info["name"]
        print(f"Logged in as: {username}")
    except Exception as e:
        print("Not logged in. Please run: huggingface-cli login")
        print("Or set HF_TOKEN environment variable")
        return False
    
    repo_id = f"{username}/{SPACE_NAME}"
    
    # Create the space
    try:
        create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            exist_ok=True,
            private=False
        )
        print(f"Space created/exists: {repo_id}")
    except Exception as e:
        print(f"Error creating space: {e}")
        return False
    
    # Upload backend folder
    try:
        upload_folder(
            folder_path=BACKEND_DIR,
            repo_id=repo_id,
            repo_type="space",
            commit_message="Deploy Epilepsy Classifier API"
        )
        print(f"Uploaded successfully!")
        print(f"Your API is deploying at: https://huggingface.co/spaces/{repo_id}")
        print(f"API URL will be: https://{username}-{SPACE_NAME}.hf.space")
    except Exception as e:
        print(f"Error uploading: {e}")
        return False
    
    return True

if __name__ == "__main__":
    deploy()
