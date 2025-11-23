from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import get_db, ping_db

app = FastAPI(
    title="Stellar Etkinlik Backend",
    version="0.1.0",
)


@app.get("/")
def read_root():
    return {"message": "Stellar etkinlik backend ayakta! 🚀"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-health")
def db_health_check():
    ok = ping_db()
    return {"db_ok": ok}
    

@app.get("/example")
def example_endpoint(db: Session = Depends(get_db)):
    """
    İleride MySQL'deki tablolardan veri çekmek için kullanacağın pattern.
    Şu an sadece bağlantı kurup geri dönüyor.
    """
    # Buraya ilerde:
    # result = db.execute(...)
    # records = result.fetchall()
    return {"message": "DB bağlantısı kuruldu, buradan devam edebilirsin."}
