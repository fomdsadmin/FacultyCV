FROM amazonlinux:latest

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
        poppler-utils

# Install Pandoc manually
# Specify the version of Pandoc you want to install
ENV PANDOC_VERSION=3.6.4

RUN wget https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz && \
    tar -xvf pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz && \
    cp -r pandoc-${PANDOC_VERSION}/bin/* /usr/local/bin/ && \
    rm -rf pandoc-${PANDOC_VERSION}*

# Download and extract TeX Live installer
RUN curl -L -o install-tl-unx.tar.gz https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz

RUN yum install -y perl

ADD ./ ./cvGenerator/

RUN chmod +x ./cvGenerator/generator.py && \
    chmod +x ./cvGenerator/install.sh && \
    dos2unix ./cvGenerator/install.sh && \
    ./cvGenerator/install.sh

ENV PATH="$PATH:/latex/bin/x86_64-linux"

# Latex packages
RUN tlmgr update --self && tlmgr install booktabs textgreek etoolbox cbfonts-fd fontspec

RUN pip3 install awslambdaric && pip3 install setuptools && pip3 install pylatexenc

ENTRYPOINT ["python3", "-m", "awslambdaric"]

CMD ["cvGenerator/generator.handler"]
