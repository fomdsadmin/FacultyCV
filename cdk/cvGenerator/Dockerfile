FROM amazonlinux:latest

# Python installation
RUN yum update && yum install python3 -y && yum install python3-pip -y && pip3 install boto3 && \
    yum install gzip -y && yum install tar -y && yum install dos2unix -y && yum install google-noto-serif-fonts -y && \
    yum install fontconfig -y

RUN curl -L -o install-tl-unx.tar.gz https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz

RUN yum install -y perl

ADD ./ ./cvGenerator/

RUN chmod +x ./cvGenerator/generator.py && chmod +x ./cvGenerator/install.sh && dos2unix ./cvGenerator/install.sh && ./cvGenerator/install.sh

ENV PATH="$PATH:/latex/bin/x86_64-linux"

# Latex packages
RUN tlmgr update --self && tlmgr install booktabs textgreek etoolbox cbfonts-fd fontspec

RUN pip3 install awslambdaric && pip3 install setuptools && pip3 install pylatexenc

ENTRYPOINT ["python3", "-m", "awslambdaric"]

CMD ["cvGenerator/generator.handler"]
