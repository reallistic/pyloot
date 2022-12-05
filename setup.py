from setuptools import setup


setup(
    name="pyloot",
    versioning="post",
    setup_requires="setupmeta",
    author="Michael Chase",
    description="Multiprocessing compatible memory leak debugger inspired by dozer/dowser",
    keywords="memory profiler multiprocessing wsgi asgi",
    url="https://github.com/reallistic/pyloot",
    install_requires=["WebOb>=1.2", "importlib-resources"],
    extras_require={"test": ["pytest"]},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: Public Domain",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.7",
    entry_points=dict(console_scripts=["pyloot=pyloot.cli:main"]),
)
