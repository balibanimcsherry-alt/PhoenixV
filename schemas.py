from pydantic import BaseModel, EmailStr
class AdminLogin(BaseModel): username:str; password:str
class ChatIn(BaseModel): name:str=''; email:str=''; message:str
class CustomerRegister(BaseModel): name:str; email:str; phone:str; address:str; password:str
class CustomerLogin(BaseModel): email:str; password:str
class BookingIn(BaseModel): checkin:str; checkout:str; guests:int; guest_name:str=''; email:str=''; phone:str=''; address:str=''; promo_code:str|None=None; create_account:bool=False; password:str|None=None
class SettingsSchema(BaseModel):
    instant_booking:bool=True; direct_discount_percent:float=10; cleaning_fee:float=185; tax_percent:float=15; security_mode:str='authorization'; security_amount:float=500; cancellation_policy:str=''; promo_code:str='RETURN10'; promo_percent:float=10; airbnb_markup_percent:float=17; vrbo_markup_percent:float=20; booking_markup_percent:float=25
