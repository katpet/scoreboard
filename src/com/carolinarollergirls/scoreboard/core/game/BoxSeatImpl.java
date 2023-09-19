package com.carolinarollergirls.scoreboard.core.game;

import com.carolinarollergirls.scoreboard.core.interfaces.BoxSeat;
import com.carolinarollergirls.scoreboard.core.interfaces.BoxTrip;
import com.carolinarollergirls.scoreboard.core.interfaces.Clock;
import com.carolinarollergirls.scoreboard.core.interfaces.Fielding;
import com.carolinarollergirls.scoreboard.core.interfaces.FloorPosition;
import com.carolinarollergirls.scoreboard.core.interfaces.Role;
import com.carolinarollergirls.scoreboard.core.interfaces.Skater;
import com.carolinarollergirls.scoreboard.core.interfaces.Team;
import com.carolinarollergirls.scoreboard.event.Command;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEventProviderImpl;
import com.carolinarollergirls.scoreboard.event.Value;
import com.carolinarollergirls.scoreboard.rules.Rule;
import com.carolinarollergirls.scoreboard.utils.ScoreBoardClock;

public class BoxSeatImpl extends ScoreBoardEventProviderImpl<BoxSeat> implements BoxSeat {
    public BoxSeatImpl(Team t, BoxSeatId id) {
        super(t, t.getId() + "_" + id.toString(), Team.BOX_SEAT);
        boxSeatId = id;
        team = t;
        addProperties(props);
        wallStartTime = 0;
        fpValid = false;
        numPenalties = 1;
        setCopy(BOX_SKATER_PENALTIES, this, SKATER, Skater.PENALTY_COUNT_P2, true);
    }

    @Override
    public String getProviderId() {
        return boxSeatId.toString();
    }

    @Override
    public String getBoxClockId() {
        return "Team" + team.getProviderId() + boxSeatId;
    }

    @Override
    public Clock getBoxClock() {
        return team.getGame().getBoxClock(getBoxClockId());
    }        

    @Override
    public void execute(Command prop, Source source) {
        if (prop == START_BOX) {
            startBox();
        } else if (prop == STOP_BOX) {
            stopBox();
        } else if (prop == RESET_BOX) {
            resetBox();
        }
    }

    @Override
    protected void valueChanged(Value<?> prop, Object value, Object last, Source source, Flag flag) {
        if (prop == BOX_SKATER) {
            setBoxSkater(value.toString());
        } else if (prop == BOX_TIME_CHANGE) {
            Integer secs = (Integer)value;
            setBoxTimeChange(secs.longValue());
            set(BOX_TIME_CHANGE, 0);
        }
    }

    @Override
    public Skater getSkater() {
        return get(SKATER);
    }

    @Override
    public void setSkater(Skater s) {
        set(SKATER, s);
    }

    @Override
    public void startBox() {
        if(started()) {
            // Resume a clock that was paused.
            synchronized (coreLock) {
                Clock pc = getBoxClock();
                if(pc == null) {
                    return;
                }
                pc.start();
            }
        } else {
            if(boxSeatId == BoxSeatId.JAMMER) {
                setFloorPosition(FloorPosition.JAMMER);
            }
            if(hasFloorPosition()) {
                Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();

                Skater s = f.getSkater();
                if(s!= null) {
                    setSkater(s);
                }
        
                if( f != null ) {
                    BoxTrip curTrip = f.getCurrentBoxTrip();
                    if( curTrip == null ) {
                        team.add(Team.BOX_TRIP, new BoxTripImpl(f));

                        Clock pc = getBoxClock();
                        if(pc == null) {
                            return;
                        }
                    }
                }
            }
            restartBox();
        }
    }

    private void restartBox() {
        synchronized (coreLock)
        {
            Clock pc = getBoxClock();
            if(pc == null) {
                return;
            }
            pc.setMaximumTime(team.getGame().getLong(Rule.PENALTIES_DURATION));
            pc.setCountDirectionDown(true);
            pc.restart();
            setWallStartTime(ScoreBoardClock.getInstance().getCurrentWalltime());
            if(hasFloorPosition()) {
                if(getFloorPosition() == FloorPosition.JAMMER) {
                    // Jammer logic
                    Team otherTeam = (team.getProviderId() == Team.ID_1) ? team.getGame().getTeam(Team.ID_2) : team.getGame().getTeam(Team.ID_1);
                    for(BoxSeat bs : otherTeam.getAll(Team.BOX_SEAT)) {        
                        if(bs.getFloorPosition() == FloorPosition.JAMMER) {
                            Clock otherClock = bs.getBoxClock();
                            if(otherClock != null && otherClock.isRunning()) {
                                long penaltyDuration = team.getGame().getLong(Rule.PENALTIES_DURATION);
                                long otherMaximum = otherClock.getMaximumTime();
                                long otherTime = otherClock.getTime();
                                long otherElapsed2 = otherMaximum - otherTime;
                                long otherNewTime = 0;
                                long thisNewTime = 0;
                                if(otherMaximum == penaltyDuration) {
                                    // Simple, common case.
                                    // Sitting jammer is released,
                                    // and arriving jammer serves as much as sitting jammer did.
                                    thisNewTime = otherElapsed2;
                                    otherNewTime = 0;
                                } else if(otherMaximum > penaltyDuration) {
                                    if(otherTime > penaltyDuration) {
                                        // In this case sitting jammer has multiple penalties.
                                        // Turn new jammer away,
                                        // and reduce sitting jammer by one penalty.
                                        // If sitting jammer happens to have even more
                                        // than two penalties, other jammer can come and go
                                        // reducing sitting jammer by one penalty each time
                                        // until we arrive at the simple case.
                                        thisNewTime = 1000; // to cause zero to appear
                                        otherNewTime = otherTime - penaltyDuration;
                                    } else {
                                        // Reverts to simple case
                                        // Sitting jammer leaves,
                                        // New jammer sits for the amount that 
                                        // other jammer served of their second penalty.
                                        thisNewTime = otherElapsed2 - penaltyDuration;
                                        otherNewTime = 0;
                                    }
                                } else {
                                    // The nightmare scenario!
                                    // A jammer has returned to the box while
                                    // sitting jammer is already serving a reduced single penalty,
                                    // so can't reduce that any more.
                                    // Sitting jammer must finish their penalty,
                                    // and arriving jammer gets regular penalty.
                                    otherNewTime = otherTime;
                                    thisNewTime = penaltyDuration;
                                }
                                pc.setMaximumTime(thisNewTime);
                                pc.setTime(thisNewTime);
                                pc.restart();
                                otherClock.setTime(otherNewTime);
                            }
                            break;
                        }
                    }
                }
                Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();
                if( f != null ) {
                    BoxTrip bt = f.getCurrentBoxTrip();
                    if(bt != null) {
                        f.getCurrentBoxTrip().restart();
                    }
                }
            }
        }
    }

    @Override
    public void resetBox() {
        stopBox();        
        synchronized (coreLock) {
            Clock pc = getBoxClock();
            pc.resetTime();
            long penaltyDuration = team.getGame().getLong(Rule.PENALTIES_DURATION);
            pc.setMaximumTime(penaltyDuration);
        }
        wallStartTime = 0;
        resetSkater();
    }

    private void resetSkater() {
        if(hasFloorPosition()) {
            Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();
            if( f != null ) {
                BoxTrip curTrip = f.getCurrentBoxTrip();
                if( curTrip != null ) {
                    curTrip.delete(null);
                }
            }
        }
        set(BOX_SKATER_PENALTIES, 0);
        set(BoxSeat.BOX_SKATER, "");
        set(SKATER,null);
        fpValid = false;
    }

    @Override
    public void stopBox() {
        synchronized (coreLock) {
            Clock pc = getBoxClock();
            if(pc == null) {
                return;
            }
            pc.stop();
        }
    }
    @Override
    public void endBox() {
        if(!started()) {
            return;
        }

        synchronized (coreLock) {
            if(hasFloorPosition()) {
                Fielding f = team.getPosition(getFloorPosition()).getCurrentFielding();
                if( f != null ) {
                    BoxTrip curTrip = f.getCurrentBoxTrip();
                    if( curTrip != null ) {
                        // Add to penalty count for skater, but only when a jam is running.
                        // Assume trips ending between jams are tests or mistakes, etc.
                        Skater s = getSkater();
                        if( s != null && team.getGame().getClock(Clock.ID_JAM).isRunning()) {
                            int periodNumber = curTrip.getPeriodNumber();
                            curTrip.setPenaltyCount(getCurNumPenalties());
                            int penaltyCount = s.getPenaltyCount(periodNumber);
                            s.setPenaltyCount(periodNumber, penaltyCount + getCurNumPenalties());
                            if(periodNumber == 1) { // Period 2 count will be running total of P1 and P2
                                int penaltyCountP2 = s.getPenaltyCount(2);
                                s.setPenaltyCount(2, penaltyCountP2 + getCurNumPenalties());
                            }
                        }
                        //curTrip.end();
                        fpValid = false;
                        numPenalties = 1;
                        f.execute(Fielding.END_BOX_TRIP, Source.OTHER);
                   }
                }
            }
        }
        resetBox();
    }
    @Override
    public void setBoxSkater(String number) {
        if(!started() && !number.equals("") && !number.equals("none")) {
            // When a skater number is selected before start,
            // do a start/stop to trigger adding the box seat,
            // and wait for user to press start.
            startBox();
            stopBox();
        }

        Skater s = findSkater(number);

        if(s == null) {
            resetSkater();
            return;
        }

        setSkater(s);
        // First, remove previous skater's box trip if selection switched skaters
        if(hasFloorPosition()) {
            FloorPosition cur_fp = getFloorPosition();
            Skater cur_s = team.getPosition(cur_fp).getSkater();
            if(cur_s != null) {
                Fielding cur_f = cur_s.getCurrentFielding();
                if(cur_f != null) {
                    cur_f.getCurrentBoxTrip().delete();
                }
            }
        }

        Fielding f = s.getCurrentFielding();
        if(f == null) {
            // If the skater doesn't have a fielding, assume they're a blocker
            // that hasn't been fielded yet. Maybe nobody is doing lineup tracking.
            team.field(s, Role.BLOCKER);
            f = s.getCurrentFielding();
        }
        if(f != null) {
            FloorPosition fpos = f.getPosition().getFloorPosition();
            setFloorPosition(fpos);

            synchronized (coreLock) {
                BoxTrip curTrip = f.getCurrentBoxTrip();
                if( curTrip == null ) {
                    team.add(Team.BOX_TRIP, new BoxTripImpl(f));
                    curTrip = f.getCurrentBoxTrip();
                    curTrip.set(BoxTrip.WALLTIME_START, getWallStartTime());
                }
            }
        }
    }

    @Override
    public void setBoxTimeChange(long secs) {
        Clock bc = getBoxClock();
        long ms = secs*1000;
        long newtime = bc.getTime() + ms;
        long penaltyDuration = team.getGame().getLong(Rule.PENALTIES_DURATION);
        long maxtime = bc.getMaximumTime();
        if(newtime > maxtime) {
            bc.setMaximumTime(newtime);
        } else if(newtime <= penaltyDuration) {
            bc.setMaximumTime(penaltyDuration);
        }
        bc.setTime(newtime);

        adjustBoxTripPenaltyCount(ms);
    }

    private void adjustBoxTripPenaltyCount(long amount) {
        // If added time matches penalty duration rule
        // increment or decrement the box trip's penalty count.
        // If box trip doesn't exist yet (skater hasn't been selected yet)
        // do this based on the max time when the the box trip does start.
        long penaltyDuration = team.getGame().getLong(Rule.PENALTIES_DURATION);
        if(amount == penaltyDuration || amount == penaltyDuration*(-1)) {
            if(amount < 0) {
                numPenalties -= 1;
            } else {
                numPenalties += 1;
            }
            if(numPenalties < 1)
                numPenalties = 1;
        }
    }

    private void setFloorPosition(FloorPosition f) {
        fp = f;
        fpValid = true;
    }

    private Boolean hasFloorPosition() {
        return fpValid;
    }

    @Override
    public FloorPosition getFloorPosition() {
        return fp;
    }

    private void setWallStartTime(long w) {
        wallStartTime = w;
    }

    private long getWallStartTime() {
        return wallStartTime;
    }

    private int getCurNumPenalties() {
        return numPenalties;
    }

    private Skater findSkater(String number) {
        Skater s = null;
        if(s == null) {
            // Search through the skaters for ours
            for (Skater sk : team.getAll(Team.SKATER)) {
                if( sk.getRosterNumber().equals(number)) {
                    s = sk;
                    break;
                }
            }
        }
        return s;
    }    

    @Override
    public boolean started() {
        return wallStartTime > 0;
    }

    protected FloorPosition fp;
    protected boolean fpValid;
    protected long wallStartTime;
    protected int numPenalties;

    private BoxSeatId boxSeatId;
    private Team team;
}
