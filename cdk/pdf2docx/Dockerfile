FROM public.ecr.aws/lambda/python:3.9

# Install system packages including build tools
RUN yum update -y && \
    yum install -y \
        gcc \
        gcc-c++ \
        make \
        python3-devel \
        libffi-devel \
        openssl-devel \
        poppler-utils \
        fontconfig \
        which \
        tar \
        gzip && \
    yum clean all

# Install Python dependencies with specific versions that have wheels
RUN pip3 install --no-cache-dir \
    boto3 \
    PyMuPDF==1.23.26 \
    pdf2docx==0.5.6

# Copy the converter script
WORKDIR ${LAMBDA_TASK_ROOT}
COPY converter.py .

# Set the Lambda runtime (ENTRYPOINT already provided by AWS base image)
CMD ["converter.handler"]