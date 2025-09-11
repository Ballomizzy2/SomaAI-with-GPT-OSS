from fastapi import FastAPI
import huggingface

app = FastAPI()

text = "def"

@app.get("/")
def root():
        return huggingface.ask_soma_plus(text)
        #return {"nameOfAI": "GPT-OSS", "word" : "bRB brbb"}

# @app.post("/")
# def post_context(context: str) -> str:
#         global text
#         text = context
#         return "this is the " + context

@app.post("/")
def post_parameters(
       context: str = None,
        region: str = None,
        quality: str = None,
        severity: str = None,
        days_since_onset: str = None,
        ema_trend: str = None,
        neuro: bool = None,
        trauma: bool = None,
):
        global text
        text = context
        # Update globals in huggingface.py
        huggingface.populate_params(
        region=region,
        quality=quality,
        severity=severity,
        days_since_onset=days_since_onset,
        ema_trend=ema_trend,
        neuro=neuro,
        trauma=trauma,
    )
        return "this is " + context

