from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Image Compression API", description="Compress images using PCA", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def apply_pca(channel: np.ndarray, k: int) -> np.ndarray:
    """
    Applies PCA to a single color channel.

    Args:
        channel: 2D array of the color channel.
        k: Number of principal components to keep.

    Returns:
        Reconstructed channel as 2D array.
    """
    mean = np.mean(channel, axis=0)
    centered_channel = channel - mean

    cov_mat = np.cov(centered_channel.T)
    eig_vals, eig_vecs = np.linalg.eig(cov_mat)

    eig_vals = np.real(eig_vals)

    sorted_indices = np.argsort(eig_vals)[::-1]
    selected_eig_vecs = eig_vecs[:, sorted_indices[:k]]

    reduced = np.dot(centered_channel, selected_eig_vecs)
    reconstructed = np.dot(reduced, selected_eig_vecs.T) + mean

    return reconstructed


def process_image(image_data: bytes, k: int) -> io.BytesIO:
    """
    Processes the image data: applies PCA compression and returns JPEG buffer.

    Args:
        image_data: Raw image bytes.
        k: Number of components for PCA.

    Returns:
        BytesIO buffer of the compressed JPEG image.
    """
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image_array = np.array(image, dtype=np.float32)

    max_val = image_array.max()
    scaled_image = image_array / max_val

    blue, green, red = scaled_image[:, :, 0], scaled_image[:, :, 1], scaled_image[:, :, 2]

    red_reconstructed = apply_pca(red, k)
    green_reconstructed = apply_pca(green, k)
    blue_reconstructed = apply_pca(blue, k)

    reconstructed_image = np.dstack((blue_reconstructed, green_reconstructed, red_reconstructed))

    reconstructed_image *= max_val
    reconstructed_image = np.real(reconstructed_image)
    reconstructed_image = np.clip(reconstructed_image, 0, 255).astype(np.uint8)

    img = Image.fromarray(reconstructed_image)
    output_buffer = io.BytesIO()
    img.save(output_buffer, format='JPEG', quality=85)
    output_buffer.seek(0)

    return output_buffer


@app.get("/health", response_class=PlainTextResponse)
def health():
    """
    Health check endpoint.

    Returns:
        Plain text response: "I'm Alive"
    """
    return "I'm Alive"


@app.post("/compress")
async def compress_image(file: UploadFile = File(...), k: int = Form(50)):
    """
    Compresses an uploaded image using PCA on each color channel and returns the reduced-quality image.

    - file: The image file to compress (e.g., JPEG or PNG).
    - k: Number of principal components to keep (default 50). Lower k means more compression but lower quality.
    """
    if not (1 <= k <= 2000):
        raise HTTPException(status_code=400, detail="k must be between 1 and 2000")

    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    try:
        logger.info(f"Processing image: {file.filename} with k={k}")

        image_data = await file.read()

        output_buffer = process_image(image_data, k)

        logger.info("Image compression completed successfully")

        return Response(
            content=output_buffer.getvalue(),
            media_type='image/jpeg',
            headers={"Content-Disposition": f"attachment; filename={file.filename}_compressed.jpg"}
        )

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")