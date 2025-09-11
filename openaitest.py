from openai import OpenAI

client = OpenAI(
  api_key="test key here"
)

response = client.responses.create(
  model="gpt-4o-mini",
  input="Who is Edward Leon?",
  store=True,
)

print(response.output_text)
