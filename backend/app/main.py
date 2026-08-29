from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import settings
from .database import Base, engine
from .routes import admin_router, ai_router, public_router, customer_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE service_orders "
                "ADD COLUMN IF NOT EXISTS preferred_time TIMESTAMP NULL"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE service_orders "
                "ADD COLUMN IF NOT EXISTS staff_payment_amount FLOAT NOT NULL DEFAULT 0"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE service_orders "
                "ADD COLUMN IF NOT EXISTS inventory_cost_amount FLOAT NOT NULL DEFAULT 0"
            )
        )
        if engine.dialect.name == "postgresql":
            connection.execute(
                text(
                    "ALTER TABLE customers "
                    "ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL"
                )
            )
            connection.execute(
                text(
                    "ALTER TABLE customers "
                    "ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE"
                )
            )
            connection.execute(
                text(
                    "ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'cancelled'"
                )
            )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(public_router)
app.include_router(admin_router)
app.include_router(customer_router)
app.include_router(ai_router)