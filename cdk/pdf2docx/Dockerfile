FROM public.ecr.aws/lambda/python:3.10

# Install system packages including build tools
RUN yum update -y && \
    yum install -y \
        gcc \
        gcc-c++ \
        make \
        python3-devel \
        libffi-devel \
        openssl-devel \
        which \
        tar \
        gzip && \
    yum clean all

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    boto3 \
    pdfservices-sdk==4.2.0

# Copy the converter script
WORKDIR ${LAMBDA_TASK_ROOT}
COPY converter.py .

# Set the Lambda runtime (ENTRYPOINT already provided by AWS base image)
CMD ["converter.handler"]