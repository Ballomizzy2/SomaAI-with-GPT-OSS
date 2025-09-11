from openai import OpenAI

client = OpenAI(
  api_key="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"
)

response = client.responses.create(
  model="gpt-4o-mini",
  input="Who is Edward Leon?",
  store=True,
)

print(response.output_text)
