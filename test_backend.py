import urllib.request
import requests

# Download a test image
image_url = "https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80"
urllib.request.urlretrieve(image_url, "test_image.jpg")

# Test backend API
url = 'http://localhost:8000/api/analyze'
files = {'file': ('test_image.jpg', open('test_image.jpg', 'rb'), 'image/jpeg')}

response = requests.post(url, files=files)
print("Status Code:", response.status_code)
try:
    print("Response JSON:", response.json())
except Exception as e:
    print("Response Text:", response.text)
