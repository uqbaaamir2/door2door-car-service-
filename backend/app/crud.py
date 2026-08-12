from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import (
    Borrowing,
    Customer,
    Expense,
    InventoryItem,
    Lending,
    OrderInventoryUsage,
    OrderStatus,
    ServiceOrder,
    TeamMember,
)
from .schemas import (
    BorrowingCreate,
    CustomerCreate,
    CustomerRegister,
    ExpenseCreate,
    InventoryItemCreate,
    LendingCreate,
    InventoryUsageCreate,
    OrderUpdate,
    PublicOrderCreate,
    TeamMemberCreate,
)

SERVICE_SUBCATEGORIES = {
    "home": {
        "engine-diagnostics",
        "battery-electrical",
        "tyre-wheel",
        "brake-service",
        "ac-repair",
        "pre-purchase-inspection",
        "engine-tuning",
        "electrician",
        "car-repair-mechanic-service",
        "car-wash",
    },
    "mobile": {
        "engine-diagnostics",
        "battery-electrical",
        "tyre-wheel",
        "brake-service",
        "ac-repair",
        "pre-purchase-inspection",
        "engine-tuning",
        "car-repair-mechanic-service",
        "electrician",
        "car-wash",
    },
}

SERVICE_SUBCATEGORY_ALIASES = {
    "engine diagnostics": "engine-diagnostics",
    "engine-diagnostics": "engine-diagnostics",
    "battery electrical": "battery-electrical",
    "battery / electrical": "battery-electrical",
    "battery-electrical": "battery-electrical",
    "tyre wheel": "tyre-wheel",
    "tyre & wheel": "tyre-wheel",
    "tyre-wheel": "tyre-wheel",
    "brake service": "brake-service",
    "brake-service": "brake-service",
    "ac repair": "ac-repair",
    "ac-repair": "ac-repair",
    "pre purchase inspection": "pre-purchase-inspection",
    "pre-purchase inspection": "pre-purchase-inspection",
    "pre-purchase-inspection": "pre-purchase-inspection",
    "car repair mechanic service": "car-repair-mechanic-service",
    "car-repair-mechanic-service": "car-repair-mechanic-service",
    "engine tuning": "engine-tuning",
    "electrician": "electrician",
    "car wash": "car-wash",
    "car-wash": "car-wash",
}


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    record = Customer(**customer.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_public_order(db: Session, payload: PublicOrderCreate) -> ServiceOrder:
    service_subcategory = SERVICE_SUBCATEGORY_ALIASES.get(payload.service_subcategory.strip().lower(), payload.service_subcategory)

    if service_subcategory not in SERVICE_SUBCATEGORIES[payload.service_type.value]:
        raise ValueError("Invalid service subcategory for selected service type")

    customer = Customer(
        name=payload.customer_name,
        phone_number=payload.phone_number,
        email=payload.email,
        location=payload.location,
    )
    db.add(customer)
    db.flush()

    order = ServiceOrder(
        customer_id=customer.id,
        service_type=payload.service_type,
        service_subcategory=service_subcategory,
        location=payload.location,
        preferred_time=payload.preferred_time,
        status=OrderStatus.pending,
        collected_amount=0,
        notes=payload.notes,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def update_order(db: Session, order: ServiceOrder, payload: OrderUpdate) -> ServiceOrder:
    data = payload.model_dump(exclude_unset=True, exclude={"inventory_usage"})
    for key, value in data.items():
        setattr(order, key, value)

    if payload.inventory_usage is not None:
        existing_usages = db.query(OrderInventoryUsage).filter(OrderInventoryUsage.order_id == order.id).all()
        for existing_usage in existing_usages:
          inventory_item = db.get(InventoryItem, existing_usage.inventory_item_id)
          if inventory_item is not None:
              inventory_item.quantity += existing_usage.quantity_used
          db.delete(existing_usage)

        db.flush()

        inventory_cost_total = 0.0
        for usage_payload in payload.inventory_usage:
            inventory_item = db.get(InventoryItem, usage_payload.inventory_item_id)
            if inventory_item is None:
                raise ValueError("Inventory item not found")
            if usage_payload.quantity_used <= 0:
                raise ValueError("Inventory quantity used must be greater than zero")
            if inventory_item.quantity < usage_payload.quantity_used:
                raise ValueError(f"Insufficient stock for {inventory_item.name}")

            unit_cost = float(inventory_item.cost_per_unit or 0)
            total_cost = unit_cost * usage_payload.quantity_used
            inventory_item.quantity -= usage_payload.quantity_used
            db.add(
                OrderInventoryUsage(
                    order_id=order.id,
                    inventory_item_id=inventory_item.id,
                    quantity_used=usage_payload.quantity_used,
                    unit_cost=unit_cost,
                    total_cost=total_cost,
                )
            )
            inventory_cost_total += total_cost

        order.inventory_cost_amount = inventory_cost_total

    db.commit()
    db.refresh(order)
    return order


def create_team_member(db: Session, payload: TeamMemberCreate) -> TeamMember:
    record = TeamMember(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_inventory_item(db: Session, payload: InventoryItemCreate) -> InventoryItem:
    record = InventoryItem(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_expense(db: Session, payload: ExpenseCreate) -> Expense:
    record = Expense(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_borrowing(db: Session, payload: BorrowingCreate) -> Borrowing:
    record = Borrowing(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_lending(db: Session, payload: LendingCreate) -> Lending:
    record = Lending(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_pnl(db: Session) -> dict[str, float]:
    revenue = (
        db.query(func.coalesce(func.sum(ServiceOrder.collected_amount), 0.0))
        .filter(ServiceOrder.status == OrderStatus.completed)
        .scalar()
    )
    expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).scalar()
    inventory_costs = db.query(func.coalesce(func.sum(ServiceOrder.inventory_cost_amount), 0.0)).scalar()
    staff_payments = db.query(func.coalesce(func.sum(ServiceOrder.staff_payment_amount), 0.0)).scalar()
    direct_costs = float((inventory_costs or 0) + (staff_payments or 0))
    profit = float((revenue or 0) - (expenses or 0) - direct_costs)
    return {
        "revenue": float(revenue or 0),
        "expenses": float(expenses or 0),
        "inventory_costs": float(inventory_costs or 0),
        "staff_payments": float(staff_payments or 0),
        "direct_costs": direct_costs,
        "profit": profit,
    }


def get_financial_totals(db: Session) -> dict[str, float]:
    total_borrowed = db.query(func.coalesce(func.sum(Borrowing.amount), 0.0)).scalar()
    total_repaid = db.query(func.coalesce(func.sum(Borrowing.repaid_amount), 0.0)).scalar()
    total_lent = db.query(func.coalesce(func.sum(Lending.amount), 0.0)).scalar()
    total_collected = db.query(func.coalesce(func.sum(Lending.collected_amount), 0.0)).scalar()
    return {
        "total_borrowed": float(total_borrowed or 0),
        "total_repaid": float(total_repaid or 0),
        "total_lent": float(total_lent or 0),
        "total_collected": float(total_collected or 0),
    }


def create_customer_account(db: Session, payload: CustomerRegister, password_hash: str) -> Customer:
    record = Customer(
        name=payload.name,
        phone_number=payload.phone_number,
        email=str(payload.email),
        password_hash=password_hash,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_customer_order(
    db: Session,
    customer: Customer,
    payload: PublicOrderCreate,
) -> ServiceOrder:
    service_subcategory = SERVICE_SUBCATEGORY_ALIASES.get(
        payload.service_subcategory.strip().lower(),
        payload.service_subcategory,
    )
    if service_subcategory not in SERVICE_SUBCATEGORIES[payload.service_type.value]:
        raise ValueError("Invalid service subcategory for selected service type")

    customer.name = payload.customer_name
    customer.phone_number = payload.phone_number
    customer.email = str(payload.email) if payload.email else customer.email
    customer.location = payload.location

    order = ServiceOrder(
        customer_id=customer.id,
        service_type=payload.service_type,
        service_subcategory=service_subcategory,
        location=payload.location,
        preferred_time=payload.preferred_time,
        status=OrderStatus.pending,
        collected_amount=0,
        notes=payload.notes,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
