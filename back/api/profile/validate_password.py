import regex as re
from django.core.exceptions import ValidationError

def validate_new_password(new_password):
    if not re.search(r'[A-Z]', new_password):
        raise ValidationError("The password has to contain at least one uppercase letter.")

    if not re.search(r'[\W_]', new_password):
        raise ValidationError("The password has tp contain at least one special character.")

    if len(new_password) < 10:
        raise ValidationError("The password has to contain at least 10 characters.")
    return True