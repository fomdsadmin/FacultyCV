# Last updates: 2025-05-08 (added this comment only)
FROM amazonlinux:latest

ENV PATH="$PATH:/latex/bin/x86_64-linux"

# Install system packages and Python dependencies
RUN yum update -y && \
    yum install -y \
        gcc \
        python3-devel \
        libffi-devel \
        openssl-devel \
        python3 \
        python3-pip \
        gzip \
        tar \
        perl \
        dos2unix \
        google-noto-serif-fonts \
        fontconfig \
        wget \
        unzip \
        which \
        poppler-utils && \
    yum clean all

# Download and extract TeX Live installer
#RUN curl -L -o install-tl-unx.tar.gz https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz

ADD ./ ./cvGenerator/
 
RUN curl -L -o install-tl-unx.tar.gz https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz && \
    dos2unix ./cvGenerator/install.sh && \
    chmod +x ./cvGenerator/install.sh && \
    ./cvGenerator/install.sh && \
    rm -f install-tl-unx.tar.gz && \
    tlmgr update --self && \
    tlmgr install booktabs textgreek etoolbox cbfonts-fd fontspec

RUN pip3 install --no-cache-dir \
    awslambdaric \
    setuptools \
    pylatexenc \
    boto3 \
    pdf2docx

ENTRYPOINT ["python3", "-m", "awslambdaric"]

CMD ["cvGenerator/generator.handler"]

