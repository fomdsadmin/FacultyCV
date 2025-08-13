import base64
import http.client
import traceback
import json

GOTENBERG_HOST = "gotenberg-public-alb-1371596528.ca-central-1.elb.amazonaws.com"
GOTENBERG_PATH = "/forms/chromium/convert/html"
FIXED_BOUNDARY = "----WebKitFormBoundary123456"

def lambda_handler(event, context):
    try:
        print("==== Incoming Event ====")
        print(json.dumps(event, indent=2, default=str))

        form_data_base64 = event.get("variables", {}).get("form_data_base64")
        if not form_data_base64:
            raise ValueError("Missing 'form_data_base64' in event variables")

        form_data_bytes = base64.b64decode(form_data_base64)

        headers = {
            "Content-Type": f"multipart/form-data; boundary={FIXED_BOUNDARY}"
        }

        print(f"Sending request to Gotenberg at {GOTENBERG_HOST}{GOTENBERG_PATH}...")
        conn = http.client.HTTPConnection(GOTENBERG_HOST, 80, timeout=30)
        conn.request("POST", GOTENBERG_PATH, body=form_data_bytes, headers=headers)
        response = conn.getresponse()

        print(f"Gotenberg status: {response.status} {response.reason}")
        pdf_bytes = response.read()

        if response.status != 200:
            print("Gotenberg error body:", pdf_bytes.decode("utf-8", errors="ignore"))
            return f"Error: {response.status}"

        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
        print("PDF successfully generated. Size (bytes):", len(pdf_bytes))
        return pdf_base64

    except Exception as e:
        print("==== Exception Occurred ====")
        print("Type:", type(e).__name__)
        print("Message:", str(e))
        print("Traceback:")
        traceback.print_exc()
        return f"Exception: {type(e).__name__} - {str(e)}"
