"""
Common Shared Schemas

Pydantic models used across pipeline and server.
"""

# from pydantic import BaseModel
# from typing import Optional, List
# from uuid import UUID
# from datetime import datetime

# class Location(BaseModel):
#     """Geographic location."""
#     lat: float
#     lon: float

# class Entity(BaseModel):
#     """Basic entity representation."""
#     id: Optional[UUID] = None
#     name: str
#     country: Optional[str] = None
#     location: Optional[Location] = None

# class ContactInfo(BaseModel):
#     """Contact information."""
#     phone: Optional[List[str]] = None
#     mobile: Optional[List[str]] = None
#     email: Optional[List[str]] = None
#     website: Optional[str] = None
#     contact_person: Optional[str] = None

# class Company(BaseModel):
#     """Company data model."""
#     id: Optional[UUID] = None
#     name: str
#     country: Optional[str] = None
#     state: Optional[str] = None
#     city: Optional[str] = None
#     address_full: Optional[str] = None
#     contact_info: Optional[ContactInfo] = None
#     business_details: Optional[str] = None

# class TradeRecord(BaseModel):
#     """Trade record data model."""
#     id: Optional[UUID] = None
#     record_type: str  # 'export' or 'import'
#     exporter_name: Optional[str] = None
#     importer_name: Optional[str] = None
#     hs_code: Optional[str] = None
#     product_description: Optional[str] = None
#     quantity: Optional[float] = None
#     unit_of_measurement: Optional[str] = None
#     total_value_usd: Optional[float] = None

# TODO: Implement shared schemas
