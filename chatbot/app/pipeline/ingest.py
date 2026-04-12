import json
import os

from dotenv import load_dotenv
from google import genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from app.embeddings import EMBEDDING_DIMENSION, embed_texts

load_dotenv()

COLLECTION_NAME = "veggie_products"
JSONL_FILE = 'app/data/products_for_rag.jsonl'
API_KEY = os.getenv("API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", COLLECTION_NAME)

if not API_KEY:
    raise ValueError("Không tìm thấy API_KEY")
if not QDRANT_URL:
    raise ValueError("Không tìm thấy QDRANT_URL")
if not QDRANT_API_KEY:
    raise ValueError("Không tìm thấy QDRANT_API_KEY")

genai_client = genai.Client(api_key=API_KEY)
client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)

def ingest_data():
    if client.collection_exists(COLLECTION_NAME):
        print(f"Xoá collection cũ: {COLLECTION_NAME}")
        client.delete_collection(COLLECTION_NAME)

    print(f"Tạo collection mới: {COLLECTION_NAME}")
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=EMBEDDING_DIMENSION, distance=Distance.COSINE),
    )
    print(f"Bắt đầu xử lý Embedding từ file: {JSONL_FILE}...")

    documents = []
    with open(JSONL_FILE, "r", encoding='utf-8') as f:
        for line in f:
            documents.append(json.loads(line))

    if not documents:
        print("Không có dữ liệu để nạp. Quý kiểm tra file JSONL nhé!")
        return

    embeddings = embed_texts(
        genai_client,
        [document["content"] for document in documents],
        "RETRIEVAL_DOCUMENT",
    )

    points = []
    for i, (data, vector) in enumerate(zip(documents, embeddings)):
        points.append(
            PointStruct(
                id=i,
                vector=vector,
                payload={
                    "doc_id": data["doc_id"],
                    "content": data["content"],
                    "metadata": data["metadata"],
                },
            )
        )

    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"Đã nạp thành công {len(points)} sản phẩm vào Qdrant!")

if __name__ == "__main__":
    ingest_data()

    
