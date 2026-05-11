from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.ml import PredictionRequest, PredictionResponse
from app.services.data_service import dataset_analysis, load_upload
from app.services.model_service import load_bundle, metadata_for_bundle, predict, train_models, tree_visualization

router = APIRouter()


def _raise_http_error(exc: Exception) -> None:
    message = str(exc)
    status_code = 500 if isinstance(exc, (ImportError, ModuleNotFoundError)) or "Missing optional dependency" in message else 400
    raise HTTPException(status_code=status_code, detail=message) from exc


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "ml-service"}


@router.post("/datasets/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    try:
        loaded = await load_upload(file)
        return dataset_analysis(loaded.dataframe)
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/models/train")
async def train_model(
    file: UploadFile = File(...),
    target_disease: str | None = Form(default=None),
    target_cases: str | None = Form(default=None),
    target_deaths: str | None = Form(default=None),
    model_name: str | None = Form(default=None),
):
    try:
        loaded = await load_upload(file)
        return train_models(
            loaded.dataframe,
            target_disease=target_disease,
            target_cases=target_cases,
            target_deaths=target_deaths,
            model_name=model_name,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/predict", response_model=PredictionResponse)
def run_prediction(payload: PredictionRequest):
    try:
        return predict(payload.model_id, payload.features)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/models/{model_id}")
def get_model(model_id: str):
    try:
        return metadata_for_bundle(load_bundle(model_id))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/models/{model_id}/tree")
def get_tree(model_id: str):
    try:
        return tree_visualization(model_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
