from db_utils import sess_db_utils


class DatabaseManager:
    def __init__(self, app):
        self.app = app

    async def initialize(self):
        conn, cursor = sess_db_utils.create_connection()
        self.app.state.db_conn = conn
        self.app.state.db_cursor = cursor
        sess_db_utils.cleanup_old_sessions(conn, cursor)

    async def close(self):
        conn = self.app.state.db_conn
        sess_db_utils.close_connection(conn)
