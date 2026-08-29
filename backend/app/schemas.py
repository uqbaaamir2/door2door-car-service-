from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


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


class CustomerBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone_number: str = Field(min_length=7, max_length=30)
    email: Optional[EmailStr] = None
    location: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}




class CustomerRegister(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone_number: str = Field(min_length=7, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
class CustomerForgotPasswordRequest(BaseModel):
    email: EmailStr


class CustomerResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(default=None, min_length=7, max_length=30)
    location: Optional[str] = None


class CustomerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerRead


class PublicOrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=150)
    phone_number: str = Field(min_length=7, max_length=30)
    email: Optional[EmailStr] = None
    service_type: ServiceType
    service_subcategory: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2)
    preferred_time: Optional[datetime] = None
    notes: Optional[str] = None


class OrderBase(BaseModel):
    service_type: ServiceType
    service_subcategory: str
    location: str
    preferred_time: Optional[datetime] = None
    status: OrderStatus = OrderStatus.pending
    collected_amount: float = 0
    staff_payment_amount: float = 0
    inventory_cost_amount: float = 0
    notes: Optional[str] = None
    assigned_team_member_id: Optional[int] = None


class InventoryUsageBase(BaseModel):
    inventory_item_id: int
    quantity_used: float = Field(gt=0)


class InventoryUsageCreate(InventoryUsageBase):
    pass


class InventoryUsageRead(InventoryUsageBase):
    id: int
    unit_cost: float
    total_cost: float
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    collected_amount: Optional[float] = None
    staff_payment_amount: Optional[float] = None
    notes: Optional[str] = None
    assigned_team_member_id: Optional[int] = None
    inventory_usage: Optional[list[InventoryUsageCreate]] = None


class OrderRead(OrderBase):
    id: int
    customer_id: int
    created_at: datetime
    updated_at: datetime
    customer: CustomerRead
    inventory_usages: list[InventoryUsageRead] = []

    model_config = {"from_attributes": True}


class TeamMemberBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    role: TeamRole
    phone_number: Optional[str] = None
    is_active: bool = True


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    role: Optional[TeamRole] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None


class TeamMemberRead(TeamMemberBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class InventoryItemBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: InventoryCategory
    quantity: float = 0
    unit: str = "pcs"
    cost_per_unit: float = 0


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    category: Optional[InventoryCategory] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    cost_per_unit: Optional[float] = None


class InventoryItemRead(InventoryItemBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseBase(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    amount: float
    category: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    amount: Optional[float] = None
    category: Optional[str] = None


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BorrowingBase(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    amount: float
    repaid_amount: float = 0
    category: Optional[str] = None
    notes: Optional[str] = None


class BorrowingCreate(BorrowingBase):
    pass


class BorrowingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    amount: Optional[float] = None
    repaid_amount: Optional[float] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class BorrowingRead(BorrowingBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class LendingBase(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    amount: float
    collected_amount: float = 0
    category: Optional[str] = None
    notes: Optional[str] = None


class LendingCreate(LendingBase):
    pass


class LendingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    amount: Optional[float] = None
    collected_amount: Optional[float] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class LendingRead(LendingBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PNLResponse(BaseModel):
    revenue: float
    expenses: float
    inventory_costs: float
    staff_payments: float
    direct_costs: float
    profit: float


class DashboardSummary(BaseModel):
    customers: int
    orders: int
    pending_orders: int
    in_progress_orders: int
    completed_orders: int
    revenue: float
    expenses: float
    inventory_costs: float
    staff_payments: float
    direct_costs: float
    profit: float
    total_borrowed: float
    total_repaid: float
    total_lent: float
    total_collected: float


class AIPredictionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class AIPredictionResponse(BaseModel):
    label: str
    confidence: float = Field(ge=0, le=1)


class AIHealthResponse(BaseModel):
    status: str
    classes: int


class OrderReceiptResponse(BaseModel):
    order: OrderRead
    inventory_usages: list[InventoryUsageRead]
    revenue: float
    inventory_costs: float
    staff_payments: float
    direct_costs: float
    profit: float
