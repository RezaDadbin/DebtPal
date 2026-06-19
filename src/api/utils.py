# api/utils.py
from collections import defaultdict
from decimal import Decimal

def settle_debts_for_accounting(accounting):
    balance = defaultdict(Decimal)
    debt_items = accounting.debt_items.all()

    for item in debt_items:
        participants = item.involved_persons.all()
        payers = item.payers.all()
        if not participants:
            continue

        share = item.price / Decimal(len(participants))
        for person in participants:
            balance[person.name] -= share
        for payer in payers:
            balance[payer.name] += payer.paid_amount

    debtors = [(p, -amt) for p, amt in balance.items() if amt < 0]
    creditors = [(p, amt) for p, amt in balance.items() if amt > 0]

    payments = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor, owes = debtors[i]
        creditor, gets = creditors[j]
        payment = min(owes, gets)
        payments.append({
            "from": debtor,
            "to": creditor,
            # Convert the Decimal to a string for JSON
            "amount": str(round(payment, 2))
        })
        debtors[i] = (debtor, owes - payment)
        creditors[j] = (creditor, gets - payment)
        if debtors[i][1].is_zero(): i += 1
        if creditors[j][1].is_zero(): j += 1
    
    # Convert all Decimal balances to strings for JSON safety
    final_balances = {person: str(round(amount, 2)) for person, amount in balance.items()}
    
    return payments, final_balances