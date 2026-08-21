from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
_ENV=Path(__file__).parent/'.env'
class Settings(BaseSettings):
    database_url:str='sqlite:///./coastal_haven.db'; frontend_url:str='http://localhost:5173'; admin_username:str='admin'; admin_password:str='change-me-now'; jwt_secret:str='dev-secret-change-me'
    stripe_mode:str='test'
    stripe_webhook_secret:str=''
    stripe_secret_key:str=''          # simple override — STRIPE_SECRET_KEY on Render
    stripe_publishable_key:str=''     # simple override — STRIPE_PUBLISHABLE_KEY on Render
    stripe_test_publishable_key:str=''; stripe_test_secret_key:str=''
    stripe_live_publishable_key:str=''; stripe_live_secret_key:str=''
    stripe_success_url:str='https://orangebeachstay.com/book?success=1'; stripe_cancel_url:str='https://orangebeachstay.com/book?cancelled=1'
    guesty_api_token:str=''; guesty_listing_id:str=''; pricelabs_api_key:str=''; pricelabs_listing_id:str=''
    smtp_host:str='smtp.gmail.com'
    smtp_port:int=587
    smtp_user:str=''
    smtp_password:str=''
    from_email:str=''
    from_name:str='Coastal Haven'
    openai_api_key:str=''
    aviationstack_api_key:str=''
    airbnb_ical_url:str=''
    vrbo_ical_url:str=''
    booking_ical_url:str=''
    calendar_token:str='coastal-haven-cal-feed'
    cleaner_username:str='cleaner'
    cleaner_password:str='cleaner-change-me'
    cleaner_email:str=''
    model_config=SettingsConfigDict(env_file=str(_ENV),extra='ignore')

    @property
    def active_stripe_publishable_key(self) -> str:
        if self.stripe_publishable_key: return self.stripe_publishable_key
        return self.stripe_test_publishable_key if self.stripe_mode=='test' else self.stripe_live_publishable_key

    @property
    def active_stripe_secret_key(self) -> str:
        if self.stripe_secret_key: return self.stripe_secret_key
        return self.stripe_test_secret_key if self.stripe_mode=='test' else self.stripe_live_secret_key

settings=Settings()
