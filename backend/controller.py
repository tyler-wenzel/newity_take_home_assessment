from typing import List

from fastapi import APIRouter, HTTPException

from schemas import ApplicationDetail, ApplicationListItem, ChecklistItemPatch
from service import (
    InvalidInputError,
    NotFoundError,
    get_application,
    list_applications,
    patch_checklist_item,
)

router = APIRouter()


def _run(action):
    try:
        return action()
    except InvalidInputError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except NotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/applications", response_model=List[ApplicationListItem])
def get_applications() -> List[ApplicationListItem]:
    return _run(list_applications)


@router.get("/applications/{borrower}", response_model=ApplicationDetail)
def get_application_detail(borrower: str) -> ApplicationDetail:
    return _run(lambda: get_application(borrower))


@router.patch("/checklist-items", response_model=ApplicationDetail)
def update_checklist_item(payload: ChecklistItemPatch) -> ApplicationDetail:
    return _run(lambda: patch_checklist_item(payload))
