import regex as re
from django.core.exceptions import ValidationError

def validate_password_strength(password):
    if not re.search(r'[A-Z]', password):
        raise ValidationError("The password has to contain at least one uppercase letter.")

    if not re.search(r'[\W_]', password):
        raise ValidationError("The password has tp contain at least one special character.")

    if len(password) < 10:
        raise ValidationError("The password has to contain at least 8 characters.")
    return True