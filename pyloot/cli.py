import logging
from argparse import ArgumentParser
from argparse import SUPPRESS

from pyloot import PyLootServer


def parse_args():
    parser = ArgumentParser(
        add_help=False,
        description="Run a local wsgi server for remote in-memory storage of pyloot data",
    )
    parser.add_argument(
        "-h", "--host", default="0.0.0.0", help="Host to listen on. (Default: 0.0.0.0)"
    )
    parser.add_argument(
        "-p",
        "--port",
        default=8000,
        type=int,
        help="Port to listen on. (Default: 8000)",
    )
    parser.add_argument(
        "--help",
        action="help",
        help="show this help message and exit",
        default=SUPPRESS,
    )

    return parser.parse_args()


def main():
    logging.basicConfig(
        format="[%(asctime)s %(name)s %(levelname)s]: %(message)s", level=logging.INFO
    )
    args = parse_args()
    server = PyLootServer()
    server.serve_forever(host=args.host, port=args.port)
