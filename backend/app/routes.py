from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .auth import (
    authenticate_admin,
    create_customer_token,
    generate_customer_reset_token,
    hash_customer_password,
    hash_customer_reset_token,
    require_admin,
    require_customer,
    verify_customer_password,
)
from .ai_service import get_model, predict_text
from .crud import (
    create_borrowing,
    create_customer_account,
    create_customer_order,
    create_expense,
    create_inventory_item,
    delete_order,
    delete_inventory_item,
    delete_team_member,
    create_lending,
    create_public_order,
    create_team_member,
    delete_expense,
    delete_lending,
    get_financial_totals,
    get_pnl,
    update_customer,
    deactivate_customer,
    update_expense,
    update_inventory_item,
    update_lending,
    update_order,
    update_team_member,
    update_borrowing,
)
from .crud import delete_borrowing
from .database import get_db
from .email_service import send_password_reset_email
from .models import (
    Borrowing,
    Customer,
    CustomerPasswordResetToken,
    Expense,
    InventoryItem,
    Lending,
    OrderStatus,
    ServiceOrder,
    TeamMember,
)
from .schemas import (
    BorrowingCreate,
    BorrowingUpdate,
    CustomerAuthResponse,
    CustomerForgotPasswordRequest,
    CustomerLogin,
    CustomerProfileUpdate,
    CustomerRegister,
    CustomerResetPasswordRequest,
    BorrowingRead,
    CustomerCreate,
    CustomerRead,
    DashboardSummary,
    ExpenseCreate,
    ExpenseRead,
    ExpenseUpdate,
    InventoryItemCreate,
    InventoryItemRead,
    InventoryItemUpdate,
    LendingCreate,
    LendingRead,
    LendingUpdate,
    InventoryUsageRead,
    OrderRead,
    OrderStatus as OrderStatusSchema,
    OrderUpdate,
    PNLResponse,
    PublicOrderCreate,
    OrderReceiptResponse,
    TeamMemberCreate,
    TeamMemberRead,
    TeamMemberUpdate,
    AIHealthResponse,
    AIPredictionRequest,
    AIPredictionResponse,
)
from pydantic import BaseModel

public_router = APIRouter(prefix="/api/public", tags=["public"])
customer_router = APIRouter(prefix="/api/customer", tags=["customer"])
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])
ai_router = APIRouter(prefix="/api/ai", tags=["ai"])


class AdminLoginRequest(BaseModel):
    username: str = ""
    password: str = ""


@ai_router.get("/health", response_model=AIHealthResponse)
def ai_health():
    model = get_model()
    return {"status": "ok", "classes": len(model.labels)}


@ai_router.post("/predict", response_model=AIPredictionResponse)
def ai_predict(payload: AIPredictionRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text must not be empty")
    label, confidence = predict_text(payload.text)
    return {"label": label, "confidence": confidence}


@public_router.post("/orders", response_model=OrderRead)
def create_order(payload: PublicOrderCreate, db: Session = Depends(get_db)):
    try:
        return create_public_order(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc



@customer_router.post("/auth/register", response_model=CustomerAuthResponse)
def customer_register(payload: CustomerRegister, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    existing = (
        db.query(Customer)
        .filter(Customer.email.ilike(email))
        .first()
    )

    if existing is not None and existing.password_hash:
        raise HTTPException(status_code=409, detail="Email is already registered")

    if existing is not None:
        existing.name = payload.name
        existing.phone_number = payload.phone_number
        existing.email = email
        existing.password_hash = hash_customer_password(payload.password)
        db.commit()
        db.refresh(existing)
        customer = existing
    else:
        customer = create_customer_account(
            db,
            payload,
            hash_customer_password(payload.password),
        )
    return {
        "access_token": create_customer_token(customer.id),
        "token_type": "bearer",
        "customer": customer,
    }


@customer_router.post("/auth/login", response_model=CustomerAuthResponse)
def customer_login(payload: CustomerLogin, db: Session = Depends(get_db)):
    customer = (
        db.query(Customer)
        .filter(Customer.email == str(payload.email).strip().lower())
        .first()
    )
    if customer is None or not customer.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_customer_password(payload.password, customer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "access_token": create_customer_token(customer.id),
        "token_type": "bearer",
        "customer": customer,
    }
@customer_router.post("/auth/forgot-password")
def customer_forgot_password(
    payload: CustomerForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.email == str(payload.email).strip().lower())
        .first()
    )

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    reset_token = generate_customer_reset_token()
    token_hash = hash_customer_reset_token(reset_token)

    reset_record = CustomerPasswordResetToken(
        customer_id=customer.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=30),
        used=False,
    )

    db.add(reset_record)
    db.commit()
    send_password_reset_email(customer.email, reset_token)
    return {
    "message": "Password reset email sent successfully"
}

@customer_router.post("/auth/reset-password")
def customer_reset_password(
    payload: CustomerResetPasswordRequest,
    db: Session = Depends(get_db),
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match",
        )

    reset_record = (
        db.query(CustomerPasswordResetToken)
        .filter(
            CustomerPasswordResetToken.token_hash
            == hash_customer_reset_token(payload.token)
        )
        .first()
    )
    reset_record = (
        db.query(CustomerPasswordResetToken)
        .filter(CustomerPasswordResetToken.token_hash == hash_customer_reset_token(payload.token))
        .first()
    )

    if reset_record is None or reset_record.used or reset_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    customer = db.get(Customer, reset_record.customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.password_hash = hash_customer_password(payload.new_password)
    reset_record.used = True
    db.commit()

    return {"message": "Password reset successfully"}

@customer_router.get("/auth/me", response_model=CustomerRead)
def customer_me(customer_id: int = Depends(require_customer), db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@customer_router.patch("/profile", response_model=CustomerRead)
def customer_profile(
    payload: CustomerProfileUpdate,
    customer_id: int = Depends(require_customer),
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


@customer_router.get("/orders", response_model=list[OrderRead])
def customer_orders(
    customer_id: int = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return (
        db.query(ServiceOrder)
        .filter(ServiceOrder.customer_id == customer_id)
        .order_by(ServiceOrder.created_at.desc())
        .all()
    )

@customer_router.post("/orders", response_model=OrderRead)
def customer_create_order(
    payload: PublicOrderCreate,
    customer_id: int = Depends(require_customer),
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    try:
        return create_customer_order(db, customer, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@admin_router.post("/auth/login")
def admin_login(payload: AdminLoginRequest):
    token = authenticate_admin(payload.username, payload.password)
    if token is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": token, "token_type": "bearer"}


@admin_router.get("/auth/me")
def admin_me(_: str = Depends(require_admin)):
    return {"is_admin": True}


@admin_router.get("/customers", response_model=list[CustomerRead])
def list_customers(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Customer).order_by(Customer.created_at.desc()).all()


@admin_router.patch("/customers/{customer_id}", response_model=CustomerRead)
def patch_customer(
    customer_id: int,
    payload: CustomerProfileUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return update_customer(db, customer, payload)


@admin_router.delete("/customers/{customer_id}", response_model=CustomerRead)
def remove_customer(customer_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return deactivate_customer(db, customer)


@admin_router.get("/orders", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(ServiceOrder).order_by(ServiceOrder.created_at.desc()).all()


@admin_router.patch("/orders/{order_id}", response_model=OrderRead)
def patch_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    order = db.get(ServiceOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return update_order(db, order, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@admin_router.delete("/orders/{order_id}", status_code=204)
def remove_order(order_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    order = db.get(ServiceOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    delete_order(db, order)


@admin_router.get("/orders/{order_id}/receipt", response_model=OrderReceiptResponse)
def read_order_receipt(order_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    order = db.get(ServiceOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    inventory_usages = order.inventory_usages
    inventory_costs = float(sum(usage.total_cost for usage in inventory_usages))
    staff_payments = float(order.staff_payment_amount or 0)
    direct_costs = inventory_costs + staff_payments
    revenue = float(order.collected_amount or 0)
    profit = revenue - direct_costs

    return {
        "order": order,
        "inventory_usages": inventory_usages,
        "revenue": revenue,
        "inventory_costs": inventory_costs,
        "staff_payments": staff_payments,
        "direct_costs": direct_costs,
        "profit": profit,
    }


@admin_router.get("/team-members", response_model=list[TeamMemberRead])
def list_team_members(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(TeamMember).order_by(TeamMember.created_at.desc()).all()


@admin_router.post("/team-members", response_model=TeamMemberRead)
def add_team_member(payload: TeamMemberCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return create_team_member(db, payload)


@admin_router.put("/team-members/{member_id}", response_model=TeamMemberRead)
def edit_team_member(
    member_id: int,
    payload: TeamMemberUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    member = db.get(TeamMember, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Team member not found")
    return update_team_member(db, member, payload)


@admin_router.delete("/team-members/{member_id}", status_code=204)
def remove_team_member(member_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    member = db.get(TeamMember, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Team member not found")
    try:
        delete_team_member(db, member)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@admin_router.get("/inventory", response_model=list[InventoryItemRead])
def list_inventory(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(InventoryItem).order_by(InventoryItem.created_at.desc()).all()


@admin_router.post("/inventory", response_model=InventoryItemRead)
def add_inventory(payload: InventoryItemCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return create_inventory_item(db, payload)


@admin_router.put("/inventory/{item_id}", response_model=InventoryItemRead)
def edit_inventory(
    item_id: int,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return update_inventory_item(db, item, payload)


@admin_router.delete("/inventory/{item_id}", status_code=204)
def remove_inventory(item_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    delete_inventory_item(db, item)


@admin_router.get("/expenses", response_model=list[ExpenseRead])
def list_expenses(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Expense).order_by(Expense.created_at.desc()).all()


@admin_router.post("/expenses", response_model=ExpenseRead)
def add_expense(payload: ExpenseCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return create_expense(db, payload)


@admin_router.patch("/expenses/{expense_id}", response_model=ExpenseRead)
def patch_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return update_expense(db, expense, payload)


@admin_router.delete("/expenses/{expense_id}", status_code=204)
def remove_expense(expense_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    delete_expense(db, expense)


@admin_router.get("/borrowings", response_model=list[BorrowingRead])
def list_borrowings(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Borrowing).order_by(Borrowing.created_at.desc()).all()


@admin_router.post("/borrowings", response_model=BorrowingRead)
def add_borrowing(payload: BorrowingCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return create_borrowing(db, payload)


@admin_router.patch("/borrowings/{borrowing_id}", response_model=BorrowingRead)
def patch_borrowing(
    borrowing_id: int,
    payload: BorrowingUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    borrowing = db.get(Borrowing, borrowing_id)
    if borrowing is None:
        raise HTTPException(status_code=404, detail="Borrowing not found")
    return update_borrowing(db, borrowing, payload)


@admin_router.delete("/borrowings/{borrowing_id}", status_code=204)
def remove_borrowing(borrowing_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    borrowing = db.get(Borrowing, borrowing_id)
    if borrowing is None:
        raise HTTPException(status_code=404, detail="Borrowing not found")
    delete_borrowing(db, borrowing)


@admin_router.get("/lendings", response_model=list[LendingRead])
def list_lendings(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return db.query(Lending).order_by(Lending.created_at.desc()).all()


@admin_router.post("/lendings", response_model=LendingRead)
def add_lending(payload: LendingCreate, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return create_lending(db, payload)


@admin_router.patch("/lendings/{lending_id}", response_model=LendingRead)
def patch_lending(
    lending_id: int,
    payload: LendingUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    lending = db.get(Lending, lending_id)
    if lending is None:
        raise HTTPException(status_code=404, detail="Lending not found")
    return update_lending(db, lending, payload)


@admin_router.delete("/lendings/{lending_id}", status_code=204)
def remove_lending(lending_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    lending = db.get(Lending, lending_id)
    if lending is None:
        raise HTTPException(status_code=404, detail="Lending not found")
    delete_lending(db, lending)


@admin_router.get("/pnl", response_model=PNLResponse)
def read_pnl(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return get_pnl(db)


@admin_router.get("/dashboard", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    pnl = get_pnl(db)
    totals = get_financial_totals(db)
    customers = db.query(Customer).count()
    orders = db.query(ServiceOrder).count()
    pending_orders = db.query(ServiceOrder).filter(ServiceOrder.status == OrderStatus.pending).count()
    in_progress_orders = db.query(ServiceOrder).filter(ServiceOrder.status == OrderStatus.in_progress).count()
    completed_orders = db.query(ServiceOrder).filter(ServiceOrder.status == OrderStatus.completed).count()
    return {
        "customers": customers,
        "orders": orders,
        "pending_orders": pending_orders,
        "in_progress_orders": in_progress_orders,
        "completed_orders": completed_orders,
        **pnl,
        **totals,
    }
