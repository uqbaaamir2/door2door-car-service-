from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class ServiceType(str, Enum):
    home = "home"
    mobile = "mobile"


class OrderStatus(str, Enum):
    pending = "pending"
    in_progress = "in-progress"
    completed = "completed"
    cancelled = "cancelled"


class TeamRole(str, Enum):
    mechanic = "mechanic"
    electrician = "electrician"
    car_wash = "car-wash"


class InventoryCategory(str, Enum):
    oil = "oil"
    air_filter = "air-filter"
    oil_filter = "oil-filter"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone_number = Column(String(30), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    location = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    orders = relationship("ServiceOrder", back_populates="customer", cascade="all, delete-orphan")


class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    service_type = Column(SAEnum(ServiceType), nullable=False)
    service_subcategory = Column(String(100), nullable=False)
    location = Column(Text, nullable=False)
    preferred_time = Column(DateTime, nullable=True)
    status = Column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.pending)
    collected_amount = Column(Float, nullable=False, default=0.0)
    staff_payment_amount = Column(Float, nullable=False, default=0.0)
    inventory_cost_amount = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    assigned_team_member_id = Column(Integer, ForeignKey("team_members.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    assigned_team_member = relationship("TeamMember", back_populates="orders")
    inventory_usages = relationship("OrderInventoryUsage", back_populates="order", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    role = Column(SAEnum(TeamRole), nullable=False)
    phone_number = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    orders = relationship("ServiceOrder", back_populates="assigned_team_member")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(SAEnum(InventoryCategory), nullable=False)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(20), nullable=False, default="pcs")
    cost_per_unit = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class OrderInventoryUsage(Base):
    __tablename__ = "order_inventory_usages"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=False, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    quantity_used = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("ServiceOrder", back_populates="inventory_usages")
    inventory_item = relationship("InventoryItem")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Borrowing(Base):
    __tablename__ = "borrowings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    repaid_amount = Column(Float, nullable=False, default=0.0)
    category = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Lending(Base):
    __tablename__ = "lendings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    collected_amount = Column(Float, nullable=False, default=0.0)
    category = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
