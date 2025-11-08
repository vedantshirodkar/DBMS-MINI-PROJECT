import express from "express";
import db from "../databases/db.js";

const router = express.Router();

// DELETE SONG
router.post("/deleteSong", async (req, res) => {
  const { song_name, regemail } = req.body;

  if (!song_name || !regemail) {
    return res.status(400).json({ error: "Missing song name or user email." });
  }

  try {
    // Step 1: Get song details + regemail + album_id
    const [songRows] = await db.query(
      `SELECT s.song_id, s.album_id, a.artist_name, ma.main_artist_id
       FROM songs s
       LEFT JOIN artists a ON s.song_id = a.song_id
       LEFT JOIN albums al ON s.album_id = al.album_id
       LEFT JOIN main_artists ma ON al.main_artist_id = ma.main_artist_id
       JOIN source src ON src.song_id = s.song_id
       WHERE s.song_name = ?`,
      [song_name]
    );

    if (songRows.length === 0) {
      return res.status(404).json({ error: "Song not found." });
    }

    const song = songRows[0];

    // Step 2: Verify ownership
    const [src] = await db.query(
      "SELECT regemail FROM source WHERE song_id = ?",
      [song.song_id]
    );

    if (!src.length || src[0].regemail !== regemail) {
      return res.status(403).json({ error: "You are not authorized to delete this song." });
    }

    // Step 3: Handle album cleanup
    if (song.album_id) {
      const [albumSongs] = await db.query(
        "SELECT song_id FROM songs WHERE album_id = ?",
        [song.album_id]
      );

      // Set album_id = NULL for all songs under this album
      await db.query("UPDATE songs SET album_id = NULL WHERE album_id = ?", [song.album_id]);

      // Delete album record
      await db.query("DELETE FROM albums WHERE album_id = ?", [song.album_id]);
    }

    // Step 4: Delete song and its references (cascade handles others)
    await db.query("DELETE FROM songs WHERE song_id = ?", [song.song_id]);

    // Step 5: Decrement main artist's song count
    if (song.main_artist_id) {
      await db.query(
        "UPDATE main_artists SET no_of_songs = GREATEST(no_of_songs - 1, 0) WHERE main_artist_id = ?",
        [song.main_artist_id]
      );
    }

    res.json({ message: `Song '${song_name}' deleted successfully.` });
  } catch (err) {
    console.error("Error deleting song:", err);
    res.status(500).json({ error: "Failed to delete song." });
  }
});

export default router;
