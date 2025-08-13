import base64
import http.client
import traceback
import json

GOTENBERG_HOST = "gotenberg-public-alb-1371596528.ca-central-1.elb.amazonaws.com"
CHROMIUM_PATH = "/forms/chromium/convert/html"
LIBREOFFICE_PATH = "/forms/libreoffice/convert"
FIXED_BOUNDARY = "----WebKitFormBoundary123456"

def lambda_handler(event, context):
    try:
        print("==== Incoming Event ====")
        print(json.dumps(event, indent=2, default=str))

        # Get base64 HTML content from AppSync
        form_data_base64 = event.get("variables", {}).get("form_data_base_64")
        if not form_data_base64:
            raise ValueError("Missing 'form_data_base_64' in event variables")

        form_data_bytes = base64.b64decode(form_data_base64)

        headers = {
            "Content-Type": f"multipart/form-data; boundary={FIXED_BOUNDARY}"
        }

        # -------- PDF Generation --------
        print(f"Sending request to Chromium route at {GOTENBERG_HOST}{CHROMIUM_PATH}...")
        conn = http.client.HTTPConnection(GOTENBERG_HOST, 80, timeout=30)
        conn.request("POST", CHROMIUM_PATH, body=form_data_bytes, headers=headers)
        response = conn.getresponse()
        pdf_bytes = response.read()
        if response.status != 200:
            print("Gotenberg PDF error body:", pdf_bytes.decode("utf-8", errors="ignore"))
            return f"Error: PDF {response.status}"
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
        print("PDF successfully generated. Size (bytes):", len(pdf_bytes))

        # -------- DOCX Generation --------
        print(f"Sending request to LibreOffice route at {GOTENBERG_HOST}{LIBREOFFICE_PATH}...")
        conn = http.client.HTTPConnection(GOTENBERG_HOST, 80, timeout=30)
        conn.request("POST", LIBREOFFICE_PATH, body=form_data_bytes, headers=headers)
        response_docx = conn.getresponse()
        docx_bytes = response_docx.read()
        if response_docx.status != 200:
            print("Gotenberg DOCX error body:", docx_bytes.decode("utf-8", errors="ignore"))
            return f"Error: DOCX {response_docx.status}"
        docx_base64 = base64.b64encode(docx_bytes).decode("utf-8")
        print("DOCX successfully generated. Size (bytes):", len(docx_bytes))

        # Return both as JSON
        return {
            "pdf_base64": pdf_base64,
            "docx_base64": docx_base64
        }

    except Exception as e:
        print("==== Exception Occurred ====")
        print("Type:", type(e).__name__)
        print("Message:", str(e))
        print("Traceback:")
        traceback.print_exc()
        return f"Exception: {type(e).__name__} - {str(e)}"
